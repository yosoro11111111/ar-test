// 200种动作的精细动画定义
// 每个动作都有详细的姿势序列和持续时间

export const actionAnimations200 = {
  // ========== 基础动作 (20种) ==========
  idle: {
    duration: 2000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'idle' },
      { time: 0.5, pose: 'idleBreathe1' },
      { time: 1, pose: 'idle' }
    ]
  },
  walk: {
    duration: 2000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'walk1' },
      { time: 0.25, pose: 'walk2' },
      { time: 0.5, pose: 'walk3' },
      { time: 0.75, pose: 'walk4' },
      { time: 1, pose: 'walk1' }
    ]
  },
  run: {
    duration: 1500,
    loop: true,
    keyframes: [
      { time: 0, pose: 'run1' },
      { time: 0.25, pose: 'run2' },
      { time: 0.5, pose: 'run3' },
      { time: 0.75, pose: 'run4' },
      { time: 1, pose: 'run1' }
    ]
  },
  jump: {
    duration: 2000,
    keyframes: [
      { time: 0, pose: 'idle' },
      { time: 0.15, pose: 'crouchDeep' },
      { time: 0.35, pose: 'jumpUp' },
      { time: 0.6, pose: 'airPose' },
      { time: 0.8, pose: 'fallDown' },
      { time: 0.95, pose: 'land' },
      { time: 1, pose: 'idle' }
    ]
  },
  sit: {
    duration: 3000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'idle' },
      { time: 0.2, pose: 'crouchDeep' },
      { time: 0.5, pose: 'sitPose' },
      { time: 0.75, pose: 'sitRelax' },
      { time: 1, pose: 'sitPose' }
    ]
  },
  lie: {
    duration: 3000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'idle' },
      { time: 0.3, pose: 'crouchDeep' },
      { time: 0.6, pose: 'liePose' },
      { time: 0.8, pose: 'lieRelax' },
      { time: 1, pose: 'liePose' }
    ]
  },
  stand: {
    duration: 2000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'standAttention' },
      { time: 0.5, pose: 'standAttentionBreathe' },
      { time: 1, pose: 'standAttention' }
    ]
  },
  crouch: {
    duration: 2000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'crouchPose' },
      { time: 0.5, pose: 'crouchLookLeft' },
      { time: 0.75, pose: 'crouchPose' },
      { time: 1, pose: 'crouchLookRight' }
    ]
  },
  crawl: {
    duration: 2000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'crawl1' },
      { time: 0.25, pose: 'crawl2' },
      { time: 0.5, pose: 'crawl3' },
      { time: 0.75, pose: 'crawl4' },
      { time: 1, pose: 'crawl1' }
    ]
  },
  climb: {
    duration: 2500,
    loop: true,
    keyframes: [
      { time: 0, pose: 'climb1' },
      { time: 0.25, pose: 'climb2' },
      { time: 0.5, pose: 'climb3' },
      { time: 0.75, pose: 'climb4' },
      { time: 1, pose: 'climb1' }
    ]
  },
  swim: {
    duration: 2500,
    loop: true,
    keyframes: [
      { time: 0, pose: 'swim1' },
      { time: 0.25, pose: 'swim2' },
      { time: 0.5, pose: 'swim3' },
      { time: 0.75, pose: 'swim4' },
      { time: 1, pose: 'swim1' }
    ]
  },
  fly: {
    duration: 2500,
    loop: true,
    keyframes: [
      { time: 0, pose: 'fly1' },
      { time: 0.25, pose: 'fly2' },
      { time: 0.5, pose: 'fly3' },
      { time: 0.75, pose: 'fly2' },
      { time: 1, pose: 'fly1' }
    ]
  },
  greet: {
    duration: 2500,
    keyframes: [
      { time: 0, pose: 'idle' },
      { time: 0.1, pose: 'greetStart' },
      { time: 0.3, pose: 'greetWave1' },
      { time: 0.5, pose: 'greetWave2' },
      { time: 0.7, pose: 'greetWave1' },
      { time: 0.9, pose: 'greetStart' },
      { time: 1, pose: 'idle' }
    ]
  },
  wave: {
    duration: 2500,
    loop: true,
    keyframes: [
      { time: 0, pose: 'wave1' },
      { time: 0.2, pose: 'wave2' },
      { time: 0.4, pose: 'wave3' },
      { time: 0.6, pose: 'wave2' },
      { time: 0.8, pose: 'wave3' },
      { time: 1, pose: 'wave1' }
    ]
  },
  clap: {
    duration: 2000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'clap1' },
      { time: 0.25, pose: 'clap2' },
      { time: 0.5, pose: 'clap1' },
      { time: 0.75, pose: 'clap2' },
      { time: 1, pose: 'clap1' }
    ]
  },
  bow: {
    duration: 3000,
    keyframes: [
      { time: 0, pose: 'idle' },
      { time: 0.15, pose: 'bowStart' },
      { time: 0.4, pose: 'bowDeep' },
      { time: 0.6, pose: 'bowHold' },
      { time: 0.85, pose: 'bowStart' },
      { time: 1, pose: 'idle' }
    ]
  },
  salute: {
    duration: 2500,
    keyframes: [
      { time: 0, pose: 'idle' },
      { time: 0.2, pose: 'saluteStart' },
      { time: 0.4, pose: 'saluteHold' },
      { time: 0.8, pose: 'saluteHold' },
      { time: 0.95, pose: 'saluteStart' },
      { time: 1, pose: 'idle' }
    ]
  },
  handshake: {
    duration: 2500,
    keyframes: [
      { time: 0, pose: 'idle' },
      { time: 0.2, pose: 'handshakeReach' },
      { time: 0.4, pose: 'handshakeGrip' },
      { time: 0.6, pose: 'handshakeShake1' },
      { time: 0.7, pose: 'handshakeShake2' },
      { time: 0.8, pose: 'handshakeShake1' },
      { time: 0.95, pose: 'handshakeReach' },
      { time: 1, pose: 'idle' }
    ]
  },
  think: {
    duration: 3000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'thinkPose' },
      { time: 0.3, pose: 'thinkLookUp' },
      { time: 0.6, pose: 'thinkPose' },
      { time: 0.8, pose: 'thinkLookDown' },
      { time: 1, pose: 'thinkPose' }
    ]
  },
  observe: {
    duration: 3000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'observeLeft' },
      { time: 0.25, pose: 'observeCenter' },
      { time: 0.5, pose: 'observeRight' },
      { time: 0.75, pose: 'observeCenter' },
      { time: 1, pose: 'observeLeft' }
    ]
  },

  // ========== 情绪表情 (20种) ==========
  happy: {
    duration: 2500,
    keyframes: [
      { time: 0, pose: 'idle' },
      { time: 0.15, pose: 'happyStart' },
      { time: 0.3, pose: 'happyJump' },
      { time: 0.5, pose: 'happyArmsUp' },
      { time: 0.7, pose: 'happyJump' },
      { time: 0.85, pose: 'happyStart' },
      { time: 1, pose: 'idle' }
    ]
  },
  laugh: {
    duration: 3000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'laugh1' },
      { time: 0.25, pose: 'laugh2' },
      { time: 0.5, pose: 'laugh3' },
      { time: 0.75, pose: 'laugh2' },
      { time: 1, pose: 'laugh1' }
    ]
  },
  smile: {
    duration: 2500,
    loop: true,
    keyframes: [
      { time: 0, pose: 'smilePose' },
      { time: 0.3, pose: 'smileTilt' },
      { time: 0.7, pose: 'smilePose' },
      { time: 1, pose: 'smilePose' }
    ]
  },
  shy: {
    duration: 3000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'shyPose' },
      { time: 0.2, pose: 'shyLookAway' },
      { time: 0.5, pose: 'shyCoverFace' },
      { time: 0.8, pose: 'shyLookAway' },
      { time: 1, pose: 'shyPose' }
    ]
  },
  naughty: {
    duration: 2500,
    keyframes: [
      { time: 0, pose: 'idle' },
      { time: 0.2, pose: 'naughtyGrin' },
      { time: 0.4, pose: 'naughtyTongue' },
      { time: 0.6, pose: 'naughtyWink' },
      { time: 0.8, pose: 'naughtyGrin' },
      { time: 1, pose: 'idle' }
    ]
  },
  sad: {
    duration: 3000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'sadPose' },
      { time: 0.3, pose: 'sadLookDown' },
      { time: 0.6, pose: 'sadSigh' },
      { time: 1, pose: 'sadPose' }
    ]
  },
  cry: {
    duration: 3000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'cry1' },
      { time: 0.25, pose: 'cry2' },
      { time: 0.5, pose: 'cry3' },
      { time: 0.75, pose: 'cry2' },
      { time: 1, pose: 'cry1' }
    ]
  },
  grievance: {
    duration: 3000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'grievancePose' },
      { time: 0.3, pose: 'grievancePout' },
      { time: 0.6, pose: 'grievanceLookUp' },
      { time: 1, pose: 'grievancePose' }
    ]
  },
  disappointed: {
    duration: 2500,
    keyframes: [
      { time: 0, pose: 'idle' },
      { time: 0.3, pose: 'disappointedSlump' },
      { time: 0.6, pose: 'disappointedSigh' },
      { time: 0.9, pose: 'disappointedSlump' },
      { time: 1, pose: 'idle' }
    ]
  },
  depressed: {
    duration: 3000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'depressedPose' },
      { time: 0.4, pose: 'depressedSlump' },
      { time: 0.8, pose: 'depressedPose' },
      { time: 1, pose: 'depressedPose' }
    ]
  },
  angry: {
    duration: 2500,
    keyframes: [
      { time: 0, pose: 'idle' },
      { time: 0.15, pose: 'angryStart' },
      { time: 0.3, pose: 'angryStomp' },
      { time: 0.5, pose: 'angryPoint' },
      { time: 0.7, pose: 'angryStomp' },
      { time: 0.85, pose: 'angryStart' },
      { time: 1, pose: 'idle' }
    ]
  },
  furious: {
    duration: 3000,
    keyframes: [
      { time: 0, pose: 'idle' },
      { time: 0.1, pose: 'furiousShake' },
      { time: 0.3, pose: 'furiousStomp1' },
      { time: 0.5, pose: 'furiousStomp2' },
      { time: 0.7, pose: 'furiousShake' },
      { time: 0.9, pose: 'furiousBreath' },
      { time: 1, pose: 'idle' }
    ]
  },
  irritable: {
    duration: 2500,
    loop: true,
    keyframes: [
      { time: 0, pose: 'irritablePose' },
      { time: 0.2, pose: 'irritableTap' },
      { time: 0.4, pose: 'irritablePose' },
      { time: 0.6, pose: 'irritableSigh' },
      { time: 0.8, pose: 'irritablePose' },
      { time: 1, pose: 'irritablePose' }
    ]
  },
  tsundere: {
    duration: 3000,
    keyframes: [
      { time: 0, pose: 'idle' },
      { time: 0.2, pose: 'tsundereLookAway' },
      { time: 0.4, pose: 'tsundereCrossArm' },
      { time: 0.6, pose: 'tsundereBlush' },
      { time: 0.8, pose: 'tsunderePeek' },
      { time: 1, pose: 'idle' }
    ]
  },
  indifferent: {
    duration: 2500,
    loop: true,
    keyframes: [
      { time: 0, pose: 'indifferentPose' },
      { time: 0.3, pose: 'indifferentLookAway' },
      { time: 0.7, pose: 'indifferentPose' },
      { time: 1, pose: 'indifferentPose' }
    ]
  },
  surprised: {
    duration: 2500,
    keyframes: [
      { time: 0, pose: 'idle' },
      { time: 0.1, pose: 'surprisedJump' },
      { time: 0.3, pose: 'surprisedHandsUp' },
      { time: 0.6, pose: 'surprisedHold' },
      { time: 0.9, pose: 'surprisedRecover' },
      { time: 1, pose: 'idle' }
    ]
  },
  shocked: {
    duration: 3000,
    keyframes: [
      { time: 0, pose: 'idle' },
      { time: 0.1, pose: 'shockedGasp' },
      { time: 0.3, pose: 'shockedCoverMouth' },
      { time: 0.7, pose: 'shockedHold' },
      { time: 0.9, pose: 'shockedRecover' },
      { time: 1, pose: 'idle' }
    ]
  },
  scared: {
    duration: 3000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'scaredPose' },
      { time: 0.2, pose: 'scaredShake' },
      { time: 0.4, pose: 'scaredCower' },
      { time: 0.7, pose: 'scaredShake' },
      { time: 1, pose: 'scaredPose' }
    ]
  },
  nervous: {
    duration: 2500,
    loop: true,
    keyframes: [
      { time: 0, pose: 'nervousPose' },
      { time: 0.2, pose: 'nervousFidget1' },
      { time: 0.4, pose: 'nervousFidget2' },
      { time: 0.6, pose: 'nervousFidget1' },
      { time: 0.8, pose: 'nervousPose' },
      { time: 1, pose: 'nervousPose' }
    ]
  },
  confused: {
    duration: 2500,
    keyframes: [
      { time: 0, pose: 'idle' },
      { time: 0.2, pose: 'confusedTilt' },
      { time: 0.4, pose: 'confusedScratch' },
      { time: 0.7, pose: 'confusedTilt' },
      { time: 1, pose: 'idle' }
    ]
  },

  // ========== 战斗动作 (20种) ==========
  attack: {
    duration: 2000,
    keyframes: [
      { time: 0, pose: 'idle' },
      { time: 0.15, pose: 'attackWindup' },
      { time: 0.35, pose: 'attackStrike' },
      { time: 0.5, pose: 'attackFollow' },
      { time: 0.8, pose: 'attackRecover' },
      { time: 1, pose: 'idle' }
    ]
  },
  defend: {
    duration: 2500,
    loop: true,
    keyframes: [
      { time: 0, pose: 'defendPose' },
      { time: 0.3, pose: 'defendBrace' },
      { time: 0.6, pose: 'defendPose' },
      { time: 1, pose: 'defendPose' }
    ]
  },
  dodge: {
    duration: 1500,
    keyframes: [
      { time: 0, pose: 'idle' },
      { time: 0.2, pose: 'dodgeLean' },
      { time: 0.4, pose: 'dodgeDuck' },
      { time: 0.7, pose: 'dodgeRecover' },
      { time: 1, pose: 'idle' }
    ]
  },
  block: {
    duration: 2000,
    keyframes: [
      { time: 0, pose: 'idle' },
      { time: 0.2, pose: 'blockRaise' },
      { time: 0.5, pose: 'blockHold' },
      { time: 0.8, pose: 'blockRecover' },
      { time: 1, pose: 'idle' }
    ]
  },
  hit: {
    duration: 2000,
    keyframes: [
      { time: 0, pose: 'idle' },
      { time: 0.1, pose: 'hitImpact' },
      { time: 0.3, pose: 'hitStagger' },
      { time: 0.6, pose: 'hitRecover' },
      { time: 1, pose: 'idle' }
    ]
  },
  draw: {
    duration: 2000,
    keyframes: [
      { time: 0, pose: 'idle' },
      { time: 0.3, pose: 'drawReach' },
      { time: 0.5, pose: 'drawPull' },
      { time: 0.7, pose: 'drawReady' },
      { time: 1, pose: 'drawHold' }
    ]
  },
  sheath: {
    duration: 2000,
    keyframes: [
      { time: 0, pose: 'drawHold' },
      { time: 0.3, pose: 'sheathLower' },
      { time: 0.5, pose: 'sheathInsert' },
      { time: 0.8, pose: 'sheathFinish' },
      { time: 1, pose: 'idle' }
    ]
  },
  aim: {
    duration: 2500,
    loop: true,
    keyframes: [
      { time: 0, pose: 'aimPose' },
      { time: 0.2, pose: 'aimSteady' },
      { time: 0.5, pose: 'aimFocus' },
      { time: 0.8, pose: 'aimSteady' },
      { time: 1, pose: 'aimPose' }
    ]
  },
  shoot: {
    duration: 1500,
    keyframes: [
      { time: 0, pose: 'aimPose' },
      { time: 0.2, pose: 'shootFire' },
      { time: 0.4, pose: 'shootRecoil' },
      { time: 0.8, pose: 'shootRecover' },
      { time: 1, pose: 'aimPose' }
    ]
  },
  reload: {
    duration: 3000,
    keyframes: [
      { time: 0, pose: 'aimPose' },
      { time: 0.2, pose: 'reloadLower' },
      { time: 0.4, pose: 'reloadEject' },
      { time: 0.6, pose: 'reloadInsert' },
      { time: 0.8, pose: 'reloadCharge' },
      { time: 1, pose: 'aimPose' }
    ]
  },
  cast: {
    duration: 3000,
    keyframes: [
      { time: 0, pose: 'idle' },
      { time: 0.2, pose: 'castRaise' },
      { time: 0.4, pose: 'castCharge' },
      { time: 0.6, pose: 'castRelease' },
      { time: 0.8, pose: 'castFollow' },
      { time: 1, pose: 'idle' }
    ]
  },
  chant: {
    duration: 3000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'chant1' },
      { time: 0.25, pose: 'chant2' },
      { time: 0.5, pose: 'chant3' },
      { time: 0.75, pose: 'chant2' },
      { time: 1, pose: 'chant1' }
    ]
  },
  summon: {
    duration: 3500,
    keyframes: [
      { time: 0, pose: 'idle' },
      { time: 0.15, pose: 'summonRaise' },
      { time: 0.4, pose: 'summonCircle' },
      { time: 0.7, pose: 'summonCast' },
      { time: 0.9, pose: 'summonFinish' },
      { time: 1, pose: 'idle' }
    ]
  },
  transform: {
    duration: 4000,
    keyframes: [
      { time: 0, pose: 'idle' },
      { time: 0.2, pose: 'transformStart' },
      { time: 0.4, pose: 'transformGlow' },
      { time: 0.6, pose: 'transformMorph' },
      { time: 0.8, pose: 'transformFlash' },
      { time: 1, pose: 'transformComplete' }
    ]
  },
  burst: {
    duration: 3000,
    keyframes: [
      { time: 0, pose: 'idle' },
      { time: 0.2, pose: 'burstCharge' },
      { time: 0.5, pose: 'burstRelease' },
      { time: 0.7, pose: 'burstExpand' },
      { time: 1, pose: 'idle' }
    ]
  },
  victory: {
    duration: 3500,
    loop: true,
    keyframes: [
      { time: 0, pose: 'victoryPose' },
      { time: 0.2, pose: 'victoryFist' },
      { time: 0.4, pose: 'victoryJump' },
      { time: 0.6, pose: 'victoryPose' },
      { time: 0.8, pose: 'victoryFlex' },
      { time: 1, pose: 'victoryPose' }
    ]
  },
  defeat: {
    duration: 3000,
    keyframes: [
      { time: 0, pose: 'idle' },
      { time: 0.3, pose: 'defeatStagger' },
      { time: 0.6, pose: 'defeatFall' },
      { time: 0.85, pose: 'defeatKneel' },
      { time: 1, pose: 'defeatKneel' }
    ]
  },
  provoke: {
    duration: 2500,
    keyframes: [
      { time: 0, pose: 'idle' },
      { time: 0.2, pose: 'provokeGesture' },
      { time: 0.5, pose: 'provokeTaunt' },
      { time: 0.8, pose: 'provokeGesture' },
      { time: 1, pose: 'idle' }
    ]
  },
  taunt: {
    duration: 2500,
    keyframes: [
      { time: 0, pose: 'idle' },
      { time: 0.2, pose: 'tauntSmirk' },
      { time: 0.5, pose: 'tauntDismiss' },
      { time: 0.8, pose: 'tauntSmirk' },
      { time: 1, pose: 'idle' }
    ]
  },
  alert: {
    duration: 2000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'alertPose' },
      { time: 0.25, pose: 'alertScan' },
      { time: 0.5, pose: 'alertPose' },
      { time: 0.75, pose: 'alertScan2' },
      { time: 1, pose: 'alertPose' }
    ]
  },

  // ========== 舞蹈动作 (20种) ==========
  hiphop: {
    duration: 3000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'hiphop1' },
      { time: 0.25, pose: 'hiphop2' },
      { time: 0.5, pose: 'hiphop3' },
      { time: 0.75, pose: 'hiphop4' },
      { time: 1, pose: 'hiphop1' }
    ]
  },
  ballet: {
    duration: 4000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'ballet1' },
      { time: 0.2, pose: 'ballet2' },
      { time: 0.4, pose: 'ballet3' },
      { time: 0.6, pose: 'ballet4' },
      { time: 0.8, pose: 'ballet5' },
      { time: 1, pose: 'ballet1' }
    ]
  },
  latin: {
    duration: 3000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'latin1' },
      { time: 0.25, pose: 'latin2' },
      { time: 0.5, pose: 'latin3' },
      { time: 0.75, pose: 'latin4' },
      { time: 1, pose: 'latin1' }
    ]
  },
  jazz: {
    duration: 3000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'jazz1' },
      { time: 0.25, pose: 'jazz2' },
      { time: 0.5, pose: 'jazz3' },
      { time: 0.75, pose: 'jazz4' },
      { time: 1, pose: 'jazz1' }
    ]
  },
  modern: {
    duration: 3500,
    loop: true,
    keyframes: [
      { time: 0, pose: 'modern1' },
      { time: 0.2, pose: 'modern2' },
      { time: 0.4, pose: 'modern3' },
      { time: 0.6, pose: 'modern4' },
      { time: 0.8, pose: 'modern5' },
      { time: 1, pose: 'modern1' }
    ]
  },
  otaku: {
    duration: 3000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'otaku1' },
      { time: 0.25, pose: 'otaku2' },
      { time: 0.5, pose: 'otaku3' },
      { time: 0.75, pose: 'otaku4' },
      { time: 1, pose: 'otaku1' }
    ]
  },
  finger: {
    duration: 2500,
    loop: true,
    keyframes: [
      { time: 0, pose: 'finger1' },
      { time: 0.2, pose: 'finger2' },
      { time: 0.4, pose: 'finger3' },
      { time: 0.6, pose: 'finger4' },
      { time: 0.8, pose: 'finger5' },
      { time: 1, pose: 'finger1' }
    ]
  },
  robot: {
    duration: 2500,
    loop: true,
    keyframes: [
      { time: 0, pose: 'robot1' },
      { time: 0.25, pose: 'robot2' },
      { time: 0.5, pose: 'robot3' },
      { time: 0.75, pose: 'robot4' },
      { time: 1, pose: 'robot1' }
    ]
  },
  breakdance: {
    duration: 3500,
    loop: true,
    keyframes: [
      { time: 0, pose: 'break1' },
      { time: 0.2, pose: 'break2' },
      { time: 0.4, pose: 'break3' },
      { time: 0.6, pose: 'break4' },
      { time: 0.8, pose: 'break5' },
      { time: 1, pose: 'break1' }
    ]
  },
  pole: {
    duration: 3500,
    loop: true,
    keyframes: [
      { time: 0, pose: 'pole1' },
      { time: 0.25, pose: 'pole2' },
      { time: 0.5, pose: 'pole3' },
      { time: 0.75, pose: 'pole4' },
      { time: 1, pose: 'pole1' }
    ]
  },
  duet: {
    duration: 4000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'duet1' },
      { time: 0.25, pose: 'duet2' },
      { time: 0.5, pose: 'duet3' },
      { time: 0.75, pose: 'duet4' },
      { time: 1, pose: 'duet1' }
    ]
  },
  group: {
    duration: 4000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'group1' },
      { time: 0.2, pose: 'group2' },
      { time: 0.4, pose: 'group3' },
      { time: 0.6, pose: 'group4' },
      { time: 0.8, pose: 'group5' },
      { time: 1, pose: 'group1' }
    ]
  },
  solo: {
    duration: 4000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'solo1' },
      { time: 0.25, pose: 'solo2' },
      { time: 0.5, pose: 'solo3' },
      { time: 0.75, pose: 'solo4' },
      { time: 1, pose: 'solo1' }
    ]
  },
  backup: {
    duration: 3000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'backup1' },
      { time: 0.25, pose: 'backup2' },
      { time: 0.5, pose: 'backup3' },
      { time: 0.75, pose: 'backup4' },
      { time: 1, pose: 'backup1' }
    ]
  },
  lead: {
    duration: 3500,
    loop: true,
    keyframes: [
      { time: 0, pose: 'lead1' },
      { time: 0.2, pose: 'lead2' },
      { time: 0.4, pose: 'lead3' },
      { time: 0.6, pose: 'lead4' },
      { time: 0.8, pose: 'lead5' },
      { time: 1, pose: 'lead1' }
    ]
  },
  spin: {
    duration: 2500,
    loop: true,
    keyframes: [
      { time: 0, pose: 'spinStart' },
      { time: 0.25, pose: 'spin1' },
      { time: 0.5, pose: 'spin2' },
      { time: 0.75, pose: 'spin3' },
      { time: 1, pose: 'spinStart' }
    ]
  },
  leap: {
    duration: 2000,
    keyframes: [
      { time: 0, pose: 'idle' },
      { time: 0.2, pose: 'leapPrep' },
      { time: 0.4, pose: 'leapJump' },
      { time: 0.6, pose: 'leapPeak' },
      { time: 0.8, pose: 'leapLand' },
      { time: 1, pose: 'idle' }
    ]
  },
  slide: {
    duration: 2500,
    loop: true,
    keyframes: [
      { time: 0, pose: 'slide1' },
      { time: 0.25, pose: 'slide2' },
      { time: 0.5, pose: 'slide3' },
      { time: 0.75, pose: 'slide4' },
      { time: 1, pose: 'slide1' }
    ]
  },
  freeze: {
    duration: 3000,
    keyframes: [
      { time: 0, pose: 'freeze1' },
      { time: 0.3, pose: 'freeze2' },
      { time: 0.7, pose: 'freezeHold' },
      { time: 1, pose: 'freeze1' }
    ]
  },
  finish: {
    duration: 3000,
    keyframes: [
      { time: 0, pose: 'finish1' },
      { time: 0.3, pose: 'finish2' },
      { time: 0.6, pose: 'finishPose' },
      { time: 0.9, pose: 'finishBow' },
      { time: 1, pose: 'idle' }
    ]
  },

  // ========== 日常动作 (20种) ==========
  eat: {
    duration: 3500,
    loop: true,
    keyframes: [
      { time: 0, pose: 'eatPrep' },
      { time: 0.2, pose: 'eatLift' },
      { time: 0.4, pose: 'eatBite' },
      { time: 0.6, pose: 'eatChew' },
      { time: 0.8, pose: 'eatSwallow' },
      { time: 1, pose: 'eatPrep' }
    ]
  },
  drink: {
    duration: 3000,
    keyframes: [
      { time: 0, pose: 'idle' },
      { time: 0.2, pose: 'drinkLift' },
      { time: 0.4, pose: 'drinkSip' },
      { time: 0.7, pose: 'drinkHold' },
      { time: 0.9, pose: 'drinkLower' },
      { time: 1, pose: 'idle' }
    ]
  },
  sleep: {
    duration: 4000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'sleep1' },
      { time: 0.25, pose: 'sleep2' },
      { time: 0.5, pose: 'sleep3' },
      { time: 0.75, pose: 'sleep2' },
      { time: 1, pose: 'sleep1' }
    ]
  },
  wake: {
    duration: 3000,
    keyframes: [
      { time: 0, pose: 'sleep3' },
      { time: 0.2, pose: 'wakeStretch' },
      { time: 0.5, pose: 'wakeYawn' },
      { time: 0.8, pose: 'wakeSit' },
      { time: 1, pose: 'idle' }
    ]
  },
  wash: {
    duration: 3000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'wash1' },
      { time: 0.25, pose: 'wash2' },
      { time: 0.5, pose: 'wash3' },
      { time: 0.75, pose: 'wash2' },
      { time: 1, pose: 'wash1' }
    ]
  },
  read: {
    duration: 4000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'readHold' },
      { time: 0.2, pose: 'readLook' },
      { time: 0.4, pose: 'readTurn' },
      { time: 0.6, pose: 'readLook' },
      { time: 0.8, pose: 'readAdjust' },
      { time: 1, pose: 'readHold' }
    ]
  },
  write: {
    duration: 3000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'write1' },
      { time: 0.25, pose: 'write2' },
      { time: 0.5, pose: 'write3' },
      { time: 0.75, pose: 'write2' },
      { time: 1, pose: 'write1' }
    ]
  },
  draw: {
    duration: 3000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'drawArt1' },
      { time: 0.25, pose: 'drawArt2' },
      { time: 0.5, pose: 'drawArt3' },
      { time: 0.75, pose: 'drawArt2' },
      { time: 1, pose: 'drawArt1' }
    ]
  },
  play_piano: {
    duration: 3000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'piano1' },
      { time: 0.25, pose: 'piano2' },
      { time: 0.5, pose: 'piano3' },
      { time: 0.75, pose: 'piano4' },
      { time: 1, pose: 'piano1' }
    ]
  },
  sing: {
    duration: 3500,
    loop: true,
    keyframes: [
      { time: 0, pose: 'singPose' },
      { time: 0.2, pose: 'singBreathe' },
      { time: 0.4, pose: 'singHigh' },
      { time: 0.6, pose: 'singLow' },
      { time: 0.8, pose: 'singBreathe' },
      { time: 1, pose: 'singPose' }
    ]
  },
  phone: {
    duration: 3000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'phoneHold' },
      { time: 0.3, pose: 'phoneTalk' },
      { time: 0.6, pose: 'phoneListen' },
      { time: 1, pose: 'phoneHold' }
    ]
  },
  play_phone: {
    duration: 3000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'phonePlay1' },
      { time: 0.25, pose: 'phonePlay2' },
      { time: 0.5, pose: 'phonePlay3' },
      { time: 0.75, pose: 'phonePlay2' },
      { time: 1, pose: 'phonePlay1' }
    ]
  },
  photo: {
    duration: 3000,
    keyframes: [
      { time: 0, pose: 'idle' },
      { time: 0.2, pose: 'photoRaise' },
      { time: 0.4, pose: 'photoAim' },
      { time: 0.6, pose: 'photoClick' },
      { time: 0.8, pose: 'photoCheck' },
      { time: 1, pose: 'idle' }
    ]
  },
  selfie: {
    duration: 3000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'selfiePose' },
      { time: 0.3, pose: 'selfieSmile' },
      { time: 0.6, pose: 'selfiePeace' },
      { time: 1, pose: 'selfiePose' }
    ]
  },
  live: {
    duration: 3500,
    loop: true,
    keyframes: [
      { time: 0, pose: 'live1' },
      { time: 0.25, pose: 'live2' },
      { time: 0.5, pose: 'live3' },
      { time: 0.75, pose: 'live4' },
      { time: 1, pose: 'live1' }
    ]
  },
  shop: {
    duration: 3000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'shop1' },
      { time: 0.25, pose: 'shop2' },
      { time: 0.5, pose: 'shop3' },
      { time: 0.75, pose: 'shop4' },
      { time: 1, pose: 'shop1' }
    ]
  },
  cook: {
    duration: 3500,
    loop: true,
    keyframes: [
      { time: 0, pose: 'cook1' },
      { time: 0.2, pose: 'cook2' },
      { time: 0.4, pose: 'cook3' },
      { time: 0.6, pose: 'cook4' },
      { time: 0.8, pose: 'cook5' },
      { time: 1, pose: 'cook1' }
    ]
  },
  clean: {
    duration: 3000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'clean1' },
      { time: 0.25, pose: 'clean2' },
      { time: 0.5, pose: 'clean3' },
      { time: 0.75, pose: 'clean4' },
      { time: 1, pose: 'clean1' }
    ]
  },
  exercise: {
    duration: 3000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'exercise1' },
      { time: 0.25, pose: 'exercise2' },
      { time: 0.5, pose: 'exercise3' },
      { time: 0.75, pose: 'exercise4' },
      { time: 1, pose: 'exercise1' }
    ]
  },
  rest: {
    duration: 4000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'rest1' },
      { time: 0.25, pose: 'rest2' },
      { time: 0.5, pose: 'rest3' },
      { time: 0.75, pose: 'rest2' },
      { time: 1, pose: 'rest1' }
    ]
  },

  // ========== 姿势动作 (20种) ==========
  pose_peace: {
    duration: 3000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'peacePose' },
      { time: 0.3, pose: 'peaceSmile' },
      { time: 0.7, pose: 'peacePose' },
      { time: 1, pose: 'peacePose' }
    ]
  },
  pose_heart: {
    duration: 3000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'heartPose' },
      { time: 0.3, pose: 'heartBig' },
      { time: 0.7, pose: 'heartPose' },
      { time: 1, pose: 'heartPose' }
    ]
  },
  pose_ok: {
    duration: 2500,
    loop: true,
    keyframes: [
      { time: 0, pose: 'okPose' },
      { time: 0.5, pose: 'okWink' },
      { time: 1, pose: 'okPose' }
    ]
  },
  pose_thumb: {
    duration: 2500,
    loop: true,
    keyframes: [
      { time: 0, pose: 'thumbPose' },
      { time: 0.3, pose: 'thumbUp' },
      { time: 0.7, pose: 'thumbPose' },
      { time: 1, pose: 'thumbPose' }
    ]
  },
  pose_point: {
    duration: 2500,
    loop: true,
    keyframes: [
      { time: 0, pose: 'pointLeft' },
      { time: 0.5, pose: 'pointRight' },
      { time: 1, pose: 'pointLeft' }
    ]
  },
  pose_cross_arm: {
    duration: 3000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'crossArmPose' },
      { time: 0.3, pose: 'crossArmShift' },
      { time: 0.7, pose: 'crossArmPose' },
      { time: 1, pose: 'crossArmPose' }
    ]
  },
  pose_hand_hip: {
    duration: 3000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'handHipPose' },
      { time: 0.3, pose: 'handHipShift' },
      { time: 0.7, pose: 'handHipPose' },
      { time: 1, pose: 'handHipPose' }
    ]
  },
  pose_back_hand: {
    duration: 3000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'backHandPose' },
      { time: 0.4, pose: 'backHandShift' },
      { time: 1, pose: 'backHandPose' }
    ]
  },
  pose_kneel: {
    duration: 3000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'kneelPose' },
      { time: 0.3, pose: 'kneelBow' },
      { time: 0.7, pose: 'kneelPose' },
      { time: 1, pose: 'kneelPose' }
    ]
  },
  pose_squat: {
    duration: 3000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'squatPose' },
      { time: 0.3, pose: 'squatDeep' },
      { time: 0.7, pose: 'squatPose' },
      { time: 1, pose: 'squatPose' }
    ]
  },
  pose_split: {
    duration: 3500,
    loop: true,
    keyframes: [
      { time: 0, pose: 'splitPose' },
      { time: 0.3, pose: 'splitStretch' },
      { time: 0.7, pose: 'splitPose' },
      { time: 1, pose: 'splitPose' }
    ]
  },
  pose_bridge: {
    duration: 3500,
    loop: true,
    keyframes: [
      { time: 0, pose: 'bridgePose' },
      { time: 0.3, pose: 'bridgeHigh' },
      { time: 0.7, pose: 'bridgePose' },
      { time: 1, pose: 'bridgePose' }
    ]
  },
  pose_handstand: {
    duration: 3500,
    loop: true,
    keyframes: [
      { time: 0, pose: 'handstandPose' },
      { time: 0.3, pose: 'handstandBalance' },
      { time: 0.7, pose: 'handstandPose' },
      { time: 1, pose: 'handstandPose' }
    ]
  },
  pose_wink: {
    duration: 2000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'winkPose' },
      { time: 0.3, pose: 'winkClose' },
      { time: 0.5, pose: 'winkPose' },
      { time: 0.8, pose: 'winkClose' },
      { time: 1, pose: 'winkPose' }
    ]
  },
  pose_pout: {
    duration: 2500,
    loop: true,
    keyframes: [
      { time: 0, pose: 'poutPose' },
      { time: 0.4, pose: 'poutBig' },
      { time: 0.8, pose: 'poutPose' },
      { time: 1, pose: 'poutPose' }
    ]
  },
  pose_tongue: {
    duration: 2000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'tonguePose' },
      { time: 0.3, pose: 'tongueOut' },
      { time: 0.6, pose: 'tonguePose' },
      { time: 1, pose: 'tonguePose' }
    ]
  },
  pose_cute: {
    duration: 3000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'cute1' },
      { time: 0.25, pose: 'cute2' },
      { time: 0.5, pose: 'cute3' },
      { time: 0.75, pose: 'cute2' },
      { time: 1, pose: 'cute1' }
    ]
  },
  pose_cool: {
    duration: 3000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'cool1' },
      { time: 0.3, pose: 'cool2' },
      { time: 0.7, pose: 'cool1' },
      { time: 1, pose: 'cool1' }
    ]
  },
  pose_elegant: {
    duration: 4000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'elegant1' },
      { time: 0.25, pose: 'elegant2' },
      { time: 0.5, pose: 'elegant3' },
      { time: 0.75, pose: 'elegant2' },
      { time: 1, pose: 'elegant1' }
    ]
  },
  pose_power: {
    duration: 3000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'power1' },
      { time: 0.3, pose: 'power2' },
      { time: 0.6, pose: 'power3' },
      { time: 1, pose: 'power1' }
    ]
  },

  // ========== 社交动作 (20种) ==========
  social_hug: {
    duration: 3000,
    keyframes: [
      { time: 0, pose: 'idle' },
      { time: 0.2, pose: 'hugOpen' },
      { time: 0.5, pose: 'hugEmbrace' },
      { time: 0.8, pose: 'hugOpen' },
      { time: 1, pose: 'idle' }
    ]
  },
  social_kiss: {
    duration: 2500,
    keyframes: [
      { time: 0, pose: 'idle' },
      { time: 0.2, pose: 'kissPucker' },
      { time: 0.4, pose: 'kissBlow' },
      { time: 0.7, pose: 'kissPucker' },
      { time: 1, pose: 'idle' }
    ]
  },
  social_highfive: {
    duration: 2000,
    keyframes: [
      { time: 0, pose: 'idle' },
      { time: 0.2, pose: 'highfiveRaise' },
      { time: 0.5, pose: 'highfiveSlap' },
      { time: 0.8, pose: 'highfiveRaise' },
      { time: 1, pose: 'idle' }
    ]
  },
  social_cheer: {
    duration: 2500,
    loop: true,
    keyframes: [
      { time: 0, pose: 'cheer1' },
      { time: 0.25, pose: 'cheer2' },
      { time: 0.5, pose: 'cheer3' },
      { time: 0.75, pose: 'cheer2' },
      { time: 1, pose: 'cheer1' }
    ]
  },
  social_comfort: {
    duration: 3000,
    keyframes: [
      { time: 0, pose: 'idle' },
      { time: 0.3, pose: 'comfortReach' },
      { time: 0.6, pose: 'comfortPat' },
      { time: 0.9, pose: 'comfortReach' },
      { time: 1, pose: 'idle' }
    ]
  },
  social_guide: {
    duration: 3000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'guideLeft' },
      { time: 0.5, pose: 'guideRight' },
      { time: 1, pose: 'guideLeft' }
    ]
  },
  social_invite: {
    duration: 3000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'invitePose' },
      { time: 0.3, pose: 'inviteGesture' },
      { time: 0.7, pose: 'invitePose' },
      { time: 1, pose: 'invitePose' }
    ]
  },
  social_refuse: {
    duration: 2500,
    keyframes: [
      { time: 0, pose: 'idle' },
      { time: 0.2, pose: 'refuseWave' },
      { time: 0.5, pose: 'refuseShake' },
      { time: 0.8, pose: 'refuseWave' },
      { time: 1, pose: 'idle' }
    ]
  },
  social_agree: {
    duration: 2500,
    keyframes: [
      { time: 0, pose: 'idle' },
      { time: 0.2, pose: 'agreeNod' },
      { time: 0.5, pose: 'agreeThumbs' },
      { time: 0.8, pose: 'agreeNod' },
      { time: 1, pose: 'idle' }
    ]
  },
  social_beg: {
    duration: 3000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'begPose' },
      { time: 0.3, pose: 'begPlease' },
      { time: 0.7, pose: 'begPose' },
      { time: 1, pose: 'begPose' }
    ]
  },
  social_apologize: {
    duration: 3000,
    keyframes: [
      { time: 0, pose: 'idle' },
      { time: 0.2, pose: 'apologizeBow' },
      { time: 0.6, pose: 'apologizeDeep' },
      { time: 0.9, pose: 'apologizeBow' },
      { time: 1, pose: 'idle' }
    ]
  },
  social_thank: {
    duration: 2500,
    keyframes: [
      { time: 0, pose: 'idle' },
      { time: 0.2, pose: 'thankBow' },
      { time: 0.5, pose: 'thankSmile' },
      { time: 0.8, pose: 'thankBow' },
      { time: 1, pose: 'idle' }
    ]
  },
  social_congratulate: {
    duration: 3000,
    keyframes: [
      { time: 0, pose: 'idle' },
      { time: 0.2, pose: 'congratulateClap' },
      { time: 0.5, pose: 'congratulateCheer' },
      { time: 0.8, pose: 'congratulateClap' },
      { time: 1, pose: 'idle' }
    ]
  },
  social_mourn: {
    duration: 4000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'mournPose' },
      { time: 0.3, pose: 'mournBow' },
      { time: 0.7, pose: 'mournPose' },
      { time: 1, pose: 'mournPose' }
    ]
  },
  social_respect: {
    duration: 3000,
    keyframes: [
      { time: 0, pose: 'idle' },
      { time: 0.2, pose: 'respectBow' },
      { time: 0.6, pose: 'respectDeep' },
      { time: 0.9, pose: 'respectBow' },
      { time: 1, pose: 'idle' }
    ]
  },
  social_welcome: {
    duration: 3000,
    keyframes: [
      { time: 0, pose: 'idle' },
      { time: 0.2, pose: 'welcomeOpen' },
      { time: 0.5, pose: 'welcomeArms' },
      { time: 0.8, pose: 'welcomeOpen' },
      { time: 1, pose: 'idle' }
    ]
  },
  social_goodbye: {
    duration: 2500,
    keyframes: [
      { time: 0, pose: 'idle' },
      { time: 0.2, pose: 'goodbyeWave' },
      { time: 0.5, pose: 'goodbyeTurn' },
      { time: 0.8, pose: 'goodbyeWave' },
      { time: 1, pose: 'idle' }
    ]
  },
  social_introduce: {
    duration: 3000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'introducePose' },
      { time: 0.3, pose: 'introduceGesture' },
      { time: 0.7, pose: 'introducePose' },
      { time: 1, pose: 'introducePose' }
    ]
  },
  social_listen: {
    duration: 3000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'listenPose' },
      { time: 0.3, pose: 'listenLean' },
      { time: 0.7, pose: 'listenPose' },
      { time: 1, pose: 'listenPose' }
    ]
  },
  social_secret: {
    duration: 2500,
    loop: true,
    keyframes: [
      { time: 0, pose: 'secretShush' },
      { time: 0.4, pose: 'secretSmile' },
      { time: 0.8, pose: 'secretShush' },
      { time: 1, pose: 'secretShush' }
    ]
  },

  // ========== 运动动作 (20种) ==========
  sport_pushup: {
    duration: 2000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'pushup1' },
      { time: 0.5, pose: 'pushup2' },
      { time: 1, pose: 'pushup1' }
    ]
  },
  sport_situp: {
    duration: 2000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'situp1' },
      { time: 0.5, pose: 'situp2' },
      { time: 1, pose: 'situp1' }
    ]
  },
  sport_squat: {
    duration: 2000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'squatSport1' },
      { time: 0.5, pose: 'squatSport2' },
      { time: 1, pose: 'squatSport1' }
    ]
  },
  sport_lunge: {
    duration: 2500,
    loop: true,
    keyframes: [
      { time: 0, pose: 'lunge1' },
      { time: 0.5, pose: 'lunge2' },
      { time: 1, pose: 'lunge1' }
    ]
  },
  sport_plank: {
    duration: 3000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'plank1' },
      { time: 0.5, pose: 'plank2' },
      { time: 1, pose: 'plank1' }
    ]
  },
  sport_yoga: {
    duration: 4000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'yoga1' },
      { time: 0.25, pose: 'yoga2' },
      { time: 0.5, pose: 'yoga3' },
      { time: 0.75, pose: 'yoga2' },
      { time: 1, pose: 'yoga1' }
    ]
  },
  sport_meditation: {
    duration: 4000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'meditate1' },
      { time: 0.5, pose: 'meditate2' },
      { time: 1, pose: 'meditate1' }
    ]
  },
  sport_stretch: {
    duration: 3000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'stretch1' },
      { time: 0.25, pose: 'stretch2' },
      { time: 0.5, pose: 'stretch3' },
      { time: 0.75, pose: 'stretch2' },
      { time: 1, pose: 'stretch1' }
    ]
  },
  sport_warmup: {
    duration: 3000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'warmup1' },
      { time: 0.25, pose: 'warmup2' },
      { time: 0.5, pose: 'warmup3' },
      { time: 0.75, pose: 'warmup4' },
      { time: 1, pose: 'warmup1' }
    ]
  },
  sport_boxing: {
    duration: 2000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'box1' },
      { time: 0.25, pose: 'box2' },
      { time: 0.5, pose: 'box3' },
      { time: 0.75, pose: 'box2' },
      { time: 1, pose: 'box1' }
    ]
  },
  sport_kick: {
    duration: 2000,
    keyframes: [
      { time: 0, pose: 'idle' },
      { time: 0.2, pose: 'kickWindup' },
      { time: 0.4, pose: 'kickHigh' },
      { time: 0.7, pose: 'kickRecover' },
      { time: 1, pose: 'idle' }
    ]
  },
  sport_throw: {
    duration: 2500,
    keyframes: [
      { time: 0, pose: 'idle' },
      { time: 0.2, pose: 'throwWindup' },
      { time: 0.5, pose: 'throwRelease' },
      { time: 0.8, pose: 'throwFollow' },
      { time: 1, pose: 'idle' }
    ]
  },
  sport_catch: {
    duration: 2000,
    keyframes: [
      { time: 0, pose: 'idle' },
      { time: 0.3, pose: 'catchReady' },
      { time: 0.6, pose: 'catchGrab' },
      { time: 1, pose: 'idle' }
    ]
  },
  sport_dribble: {
    duration: 2000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'dribble1' },
      { time: 0.25, pose: 'dribble2' },
      { time: 0.5, pose: 'dribble3' },
      { time: 0.75, pose: 'dribble2' },
      { time: 1, pose: 'dribble1' }
    ]
  },
  sport_shoot: {
    duration: 2500,
    keyframes: [
      { time: 0, pose: 'idle' },
      { time: 0.2, pose: 'shootPrep' },
      { time: 0.5, pose: 'shootJump' },
      { time: 0.8, pose: 'shootLand' },
      { time: 1, pose: 'idle' }
    ]
  },
  soccer_dribble: {
    duration: 2000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'soccer1' },
      { time: 0.25, pose: 'soccer2' },
      { time: 0.5, pose: 'soccer3' },
      { time: 0.75, pose: 'soccer2' },
      { time: 1, pose: 'soccer1' }
    ]
  },
  soccer_shoot: {
    duration: 2500,
    keyframes: [
      { time: 0, pose: 'idle' },
      { time: 0.2, pose: 'soccerShootRun' },
      { time: 0.5, pose: 'soccerShootKick' },
      { time: 0.8, pose: 'soccerShootFollow' },
      { time: 1, pose: 'idle' }
    ]
  },
  tennis_serve: {
    duration: 3000,
    keyframes: [
      { time: 0, pose: 'idle' },
      { time: 0.2, pose: 'tennisToss' },
      { time: 0.5, pose: 'tennisSwing' },
      { time: 0.8, pose: 'tennisFollow' },
      { time: 1, pose: 'idle' }
    ]
  },
  golf_swing: {
    duration: 3000,
    keyframes: [
      { time: 0, pose: 'idle' },
      { time: 0.3, pose: 'golfBack' },
      { time: 0.6, pose: 'golfSwing' },
      { time: 0.9, pose: 'golfFollow' },
      { time: 1, pose: 'idle' }
    ]
  },
  skiing: {
    duration: 2500,
    loop: true,
    keyframes: [
      { time: 0, pose: 'ski1' },
      { time: 0.25, pose: 'ski2' },
      { time: 0.5, pose: 'ski3' },
      { time: 0.75, pose: 'ski2' },
      { time: 1, pose: 'ski1' }
    ]
  },

  // ========== 职业动作 (20种) ==========
  profession_doctor: {
    duration: 3000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'doctor1' },
      { time: 0.3, pose: 'doctor2' },
      { time: 0.7, pose: 'doctor1' },
      { time: 1, pose: 'doctor1' }
    ]
  },
  profession_nurse: {
    duration: 3000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'nurse1' },
      { time: 0.3, pose: 'nurse2' },
      { time: 0.7, pose: 'nurse1' },
      { time: 1, pose: 'nurse1' }
    ]
  },
  profession_teacher: {
    duration: 3000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'teacher1' },
      { time: 0.25, pose: 'teacher2' },
      { time: 0.5, pose: 'teacher3' },
      { time: 0.75, pose: 'teacher2' },
      { time: 1, pose: 'teacher1' }
    ]
  },
  profession_student: {
    duration: 2500,
    keyframes: [
      { time: 0, pose: 'idle' },
      { time: 0.2, pose: 'studentRaise' },
      { time: 0.6, pose: 'studentAnswer' },
      { time: 0.9, pose: 'studentRaise' },
      { time: 1, pose: 'idle' }
    ]
  },
  profession_chef: {
    duration: 3000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'chef1' },
      { time: 0.25, pose: 'chef2' },
      { time: 0.5, pose: 'chef3' },
      { time: 0.75, pose: 'chef2' },
      { time: 1, pose: 'chef1' }
    ]
  },
  profession_waiter: {
    duration: 3000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'waiter1' },
      { time: 0.3, pose: 'waiter2' },
      { time: 0.7, pose: 'waiter1' },
      { time: 1, pose: 'waiter1' }
    ]
  },
  profession_police: {
    duration: 3000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'police1' },
      { time: 0.25, pose: 'police2' },
      { time: 0.5, pose: 'police3' },
      { time: 0.75, pose: 'police2' },
      { time: 1, pose: 'police1' }
    ]
  },
  profession_firefighter: {
    duration: 3000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'firefighter1' },
      { time: 0.3, pose: 'firefighter2' },
      { time: 0.7, pose: 'firefighter1' },
      { time: 1, pose: 'firefighter1' }
    ]
  },
  profession_driver: {
    duration: 3000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'driver1' },
      { time: 0.3, pose: 'driver2' },
      { time: 0.7, pose: 'driver1' },
      { time: 1, pose: 'driver1' }
    ]
  },
  profession_pilot: {
    duration: 3000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'pilot1' },
      { time: 0.3, pose: 'pilot2' },
      { time: 0.7, pose: 'pilot1' },
      { time: 1, pose: 'pilot1' }
    ]
  },
  profession_sailor: {
    duration: 3000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'sailor1' },
      { time: 0.3, pose: 'sailor2' },
      { time: 0.7, pose: 'sailor1' },
      { time: 1, pose: 'sailor1' }
    ]
  },
  profession_farmer: {
    duration: 3000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'farmer1' },
      { time: 0.25, pose: 'farmer2' },
      { time: 0.5, pose: 'farmer3' },
      { time: 0.75, pose: 'farmer2' },
      { time: 1, pose: 'farmer1' }
    ]
  },
  profession_worker: {
    duration: 3000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'worker1' },
      { time: 0.25, pose: 'worker2' },
      { time: 0.5, pose: 'worker3' },
      { time: 0.75, pose: 'worker2' },
      { time: 1, pose: 'worker1' }
    ]
  },
  profession_scientist: {
    duration: 3000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'scientist1' },
      { time: 0.3, pose: 'scientist2' },
      { time: 0.7, pose: 'scientist1' },
      { time: 1, pose: 'scientist1' }
    ]
  },
  profession_artist: {
    duration: 3000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'artist1' },
      { time: 0.25, pose: 'artist2' },
      { time: 0.5, pose: 'artist3' },
      { time: 0.75, pose: 'artist2' },
      { time: 1, pose: 'artist1' }
    ]
  },
  profession_musician: {
    duration: 3000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'musician1' },
      { time: 0.25, pose: 'musician2' },
      { time: 0.5, pose: 'musician3' },
      { time: 0.75, pose: 'musician2' },
      { time: 1, pose: 'musician1' }
    ]
  },
  profession_dancer: {
    duration: 3000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'dancer1' },
      { time: 0.25, pose: 'dancer2' },
      { time: 0.5, pose: 'dancer3' },
      { time: 0.75, pose: 'dancer2' },
      { time: 1, pose: 'dancer1' }
    ]
  },
  profession_athlete: {
    duration: 3000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'athlete1' },
      { time: 0.3, pose: 'athlete2' },
      { time: 0.7, pose: 'athlete1' },
      { time: 1, pose: 'athlete1' }
    ]
  },
  profession_judge: {
    duration: 3000,
    keyframes: [
      { time: 0, pose: 'idle' },
      { time: 0.3, pose: 'judgeRaise' },
      { time: 0.6, pose: 'judgeStrike' },
      { time: 0.9, pose: 'judgeLower' },
      { time: 1, pose: 'idle' }
    ]
  },
  profession_magic: {
    duration: 3500,
    keyframes: [
      { time: 0, pose: 'idle' },
      { time: 0.2, pose: 'magicShow1' },
      { time: 0.5, pose: 'magicShow2' },
      { time: 0.8, pose: 'magicReveal' },
      { time: 1, pose: 'idle' }
    ]
  },

  // ========== 特殊动作 (20种) ==========
  special_transform: {
    duration: 4000,
    keyframes: [
      { time: 0, pose: 'idle' },
      { time: 0.2, pose: 'specialTransform1' },
      { time: 0.5, pose: 'specialTransform2' },
      { time: 0.8, pose: 'specialTransform3' },
      { time: 1, pose: 'specialTransformComplete' }
    ]
  },
  special_fly: {
    duration: 3000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'specialFly1' },
      { time: 0.25, pose: 'specialFly2' },
      { time: 0.5, pose: 'specialFly3' },
      { time: 0.75, pose: 'specialFly2' },
      { time: 1, pose: 'specialFly1' }
    ]
  },
  special_teleport: {
    duration: 3000,
    keyframes: [
      { time: 0, pose: 'idle' },
      { time: 0.3, pose: 'teleportFade' },
      { time: 0.5, pose: 'teleportGone' },
      { time: 0.7, pose: 'teleportAppear' },
      { time: 1, pose: 'idle' }
    ]
  },
  special_invisible: {
    duration: 3000,
    keyframes: [
      { time: 0, pose: 'idle' },
      { time: 0.3, pose: 'invisibleFade' },
      { time: 0.6, pose: 'invisibleGone' },
      { time: 0.9, pose: 'invisibleFade' },
      { time: 1, pose: 'idle' }
    ]
  },
  special_clone: {
    duration: 3500,
    keyframes: [
      { time: 0, pose: 'idle' },
      { time: 0.2, pose: 'cloneStart' },
      { time: 0.5, pose: 'cloneSplit' },
      { time: 0.8, pose: 'cloneMulti' },
      { time: 1, pose: 'idle' }
    ]
  },
  special_giant: {
    duration: 3500,
    keyframes: [
      { time: 0, pose: 'idle' },
      { time: 0.3, pose: 'giantGrow1' },
      { time: 0.6, pose: 'giantGrow2' },
      { time: 0.9, pose: 'giantGrow3' },
      { time: 1, pose: 'giantComplete' }
    ]
  },
  special_shrink: {
    duration: 3500,
    keyframes: [
      { time: 0, pose: 'idle' },
      { time: 0.3, pose: 'shrink1' },
      { time: 0.6, pose: 'shrink2' },
      { time: 0.9, pose: 'shrink3' },
      { time: 1, pose: 'shrinkComplete' }
    ]
  },
  special_time_stop: {
    duration: 4000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'timestop1' },
      { time: 0.5, pose: 'timestop2' },
      { time: 1, pose: 'timestop1' }
    ]
  },
  special_rewind: {
    duration: 3500,
    keyframes: [
      { time: 0, pose: 'idle' },
      { time: 0.2, pose: 'rewindStart' },
      { time: 0.5, pose: 'rewindSpin' },
      { time: 0.8, pose: 'rewindBack' },
      { time: 1, pose: 'idle' }
    ]
  },
  special_portal: {
    duration: 3500,
    keyframes: [
      { time: 0, pose: 'idle' },
      { time: 0.2, pose: 'portalOpen' },
      { time: 0.5, pose: 'portalExpand' },
      { time: 0.8, pose: 'portalStable' },
      { time: 1, pose: 'idle' }
    ]
  },
  special_aura: {
    duration: 3000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'aura1' },
      { time: 0.25, pose: 'aura2' },
      { time: 0.5, pose: 'aura3' },
      { time: 0.75, pose: 'aura2' },
      { time: 1, pose: 'aura1' }
    ]
  },
  special_charge: {
    duration: 3000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'charge1' },
      { time: 0.25, pose: 'charge2' },
      { time: 0.5, pose: 'charge3' },
      { time: 0.75, pose: 'charge2' },
      { time: 1, pose: 'charge1' }
    ]
  },
  special_heal: {
    duration: 3500,
    loop: true,
    keyframes: [
      { time: 0, pose: 'heal1' },
      { time: 0.25, pose: 'heal2' },
      { time: 0.5, pose: 'heal3' },
      { time: 0.75, pose: 'heal2' },
      { time: 1, pose: 'heal1' }
    ]
  },
  special_shield: {
    duration: 3000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'shield1' },
      { time: 0.3, pose: 'shield2' },
      { time: 0.7, pose: 'shield1' },
      { time: 1, pose: 'shield1' }
    ]
  },
  special_frozen: {
    duration: 4000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'frozen1' },
      { time: 0.5, pose: 'frozen2' },
      { time: 1, pose: 'frozen1' }
    ]
  },
  special_burn: {
    duration: 3000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'burn1' },
      { time: 0.25, pose: 'burn2' },
      { time: 0.5, pose: 'burn3' },
      { time: 0.75, pose: 'burn2' },
      { time: 1, pose: 'burn1' }
    ]
  },
  special_electric: {
    duration: 2500,
    loop: true,
    keyframes: [
      { time: 0, pose: 'electric1' },
      { time: 0.2, pose: 'electric2' },
      { time: 0.4, pose: 'electric3' },
      { time: 0.6, pose: 'electric2' },
      { time: 0.8, pose: 'electric1' },
      { time: 1, pose: 'electric1' }
    ]
  },
  special_poison: {
    duration: 3000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'poison1' },
      { time: 0.3, pose: 'poison2' },
      { time: 0.7, pose: 'poison1' },
      { time: 1, pose: 'poison1' }
    ]
  },
  special_sleep: {
    duration: 4000,
    loop: true,
    keyframes: [
      { time: 0, pose: 'magicSleep1' },
      { time: 0.5, pose: 'magicSleep2' },
      { time: 1, pose: 'magicSleep1' }
    ]
  },
  special_revive: {
    duration: 4000,
    keyframes: [
      { time: 0, pose: 'revive1' },
      { time: 0.2, pose: 'revive2' },
      { time: 0.5, pose: 'revive3' },
      { time: 0.8, pose: 'revive4' },
      { time: 1, pose: 'idle' }
    ]
  }
}

// 导出动作动画配置
export default actionAnimations200

// 获取动作配置
export const getActionAnimation = (actionId) => {
  return actionAnimations200[actionId] || null
}

// 检查动作是否存在
export const hasActionAnimation = (actionId) => {
  return actionId in actionAnimations200
}

// 获取所有动作ID
export const getAllActionIds = () => {
  return Object.keys(actionAnimations200)
}
