import "phaser";
import { shuffle, filter, isArray, values, find, reverse, first, includes, sumBy } from "lodash";

const WIDTH = 800
const HEIGHT = 600


export class Table extends Phaser.Scene {
  public deck: string[]
  public drawnCards: string[] = []
  public playerCards: string[] = []
  public dealersCards: string[] = []
  public backFace: Phaser.GameObjects.Sprite;
  public controls: { Deal: Phaser.GameObjects.Text , Stand: Phaser.GameObjects.Text } = {
    Deal: null,
    Stand: null
  }

  constructor(config: GameConfig) {
    super({
      key: 'Table'
    })
  }

  preload(): void {
    this.load.setBaseURL('http://labs.phaser.io/assets/')
    this.load.atlas('cards', '/atlas/cards.png', '/atlas/cards.json');
  }

  create() {
    this.deck = this.initDeck()
    let x = 0;
    let y = 0;
    this.deck.forEach(card => {
      this.add.sprite(x, y, 'cards', card).setOrigin(0).setName(card)
      x += 0.2
      y += 3
    })
    this.deck = reverse(this.deck)
    this.add.sprite(x, y, 'cards', 'back').setOrigin(0).setName('back')
    this.controls.Deal = this.add.text(75, 500, 'Deal')
      .setOrigin(0).setFontSize(64).setFontStyle('bold italic')
      .setFontFamily('Arial').setBackgroundColor('#fab433')
      .setPadding(60, 10, 60, 10)
      .setAlpha(0.8)
    this.controls.Stand = this.add.text(400, 500, 'Stand')
      .setOrigin(0).setFontSize(64).setFontStyle('bold italic')
      .setFontFamily('Arial').setBackgroundColor('#fab433')
      .setPadding(60, 10, 60, 10)
      .setAlpha(0.8)
    // this.setDraggable(this.getCardSprite('back'))
    this.setInteractive(values(this.controls))
    this.input.on('drag', function(pointer, gameObject: Phaser.GameObjects.Sprite, dragX: number, dragY: number) {
      gameObject.x = dragX;
      gameObject.y = dragY
    })
    this.input.on('dragend', function (pointer, gameObject: Phaser.GameObjects.Text) {
      console.log(gameObject.x, gameObject.y)
    })
    this.input.on('pointerover', function(pointer, gameObjects: any[]) {
      gameObjects.forEach(o => {
        if (o.text === 'Stand' || o.text === 'Deal') {
          o.setAlpha(1)
        }
      })
    })
    this.input.on('pointerout', function(pointer, gameObjects: any[]) {
      gameObjects.forEach(o => {
        if (o.text === 'Stand' || o.text === 'Deal') {
          o.setAlpha(0.8)
        }
      })
    })
    this.controls.Deal.on('pointerdown', () => this.onDeal())
    this.controls.Stand.on('pointerdown', () => this.onStand())
    console.log(this)
  }

  onDeal(): void {
    if (this.drawnCards.length < 1) {
      this.firstDraw()
    } else {
      this.hitMe()
    }
  }

  firstDraw() {
    this.controls.Deal.disableInteractive()
    this.controls.Stand.disableInteractive()
    this.drawPlayer()
      .then(() => this.drawDealer())
      .then(() => this.drawPlayer(-50))
      .then(() => this.drawDealer(-50))
      .then(() => {
        const score = this.checkScore()
        if (score < 0) {
          this.dealerWin()
        } else if (score === 21) {
          this.playerWin()
        } else {
          this.drawDealer(offset)
        }
      })
  }

  onStand() {
    const dealersSum = this.sumCards(this.dealersCards)
    const canDealerDraw = dealersSum < 17
    const playerSum = this.sumCards(this.playerCards)

    if (playerSum <= 21 && !canDealerDraw) {
      this.playerWin()
    } else if (canDealerDraw) {
      console.log('dealer draws')
    }
  }

  playerWin() {
    var title = this.add.text(100, 200, 'PLAYER WINS', { fontFamily: 'Arial', fontSize: 64, color: '#00ff00' });
    console.log('PLAYER WINS')
  }

  dealerWin() {
    var title = this.add.text(100, 200, 'DEALER WINS', { fontFamily: 'Arial', fontSize: 64, color: '#00ff00' });
    console.log('DEALER WINS')
  }

  drawPlayer(offset = 0) {
    return new Promise((resolve, reject) => {
      const { deck } = this
      const currentCard = this.getCardSprite(this.getNextCardName(deck))
      const backCard = this.getCardSprite('back')
      this.drawnCards.push(currentCard.name)
      this.playerCards.push(currentCard.name)
      this.tweens.add({
        targets: currentCard,
        x: { value: 300 + offset, duration: 1500, ease: 'Power2' },
        y: { value: 250, duration: 500, ease: 'Bounce.easeOut', delay: 150 },
        onComplete: resolve
      });
      this.tweens.add({
        targets: backCard,
        x: { value: currentCard.x, duration: 1500, ease: 'Power2' },
        y: { value: currentCard.y, duration: 500, ease: 'Bounce.easeOut', delay: 150 }
      });
    })
  }

  drawDealer(offset = 0) {
    return new Promise((resolve, reject) => {
      const { deck } = this
      const currentCard = this.getCardSprite(this.getNextCardName(deck))
      const backCard = this.getCardSprite('back')
      if (this.dealersCards.length === 0) {
        currentCard.setTexture('cards', 'back')
      }
      this.drawnCards.push(currentCard.name)
      this.dealersCards.push(currentCard.name)
      this.tweens.add({
        targets: currentCard,
        x: { value: 300 + offset, duration: 1500, ease: 'Power2' },
        y: { value: 50, duration: 500, ease: 'Bounce.easeOut', delay: 150 },
        onComplete: resolve
      });
      this.tweens.add({
        targets: backCard,
        x: { value: currentCard.x, duration: 1500, ease: 'Power2' },
        y: { value: currentCard.y, duration: 500, ease: 'Bounce.easeOut', delay: 150 }
      });
    })
  }

  singleDraw(offset = 0, hideDealers = true, canDealerDraw = true) {
    this.controls.Deal.disableInteractive()
    const { deck } = this
    const currentCard = this.getCardSprite(this.getNextCardName(deck))
    const backCard = this.getCardSprite('back')
    this.drawnCards.push(currentCard.name)
    this.playerCards.push(currentCard.name)
    const nextCard = this.getCardSprite(this.getNextCardName(deck))
    this.drawnCards.push(nextCard.name)
    this.dealersCards.push(nextCard.name)
    this.tweens.add({
      targets: currentCard,
      x: { value: 300 + offset, duration: 1500, ease: 'Power2' },
      y: { value: 250, duration: 500, ease: 'Bounce.easeOut', delay: 150 },
      onComplete: () => {
        if (hideDealers) {
          nextCard.setTexture('cards', 'back')
        }
        if (canDealerDraw) {
          this.tweens.add({
            targets: nextCard,
            x: { value: 300 + offset, duration: 1500, ease: 'Power2' },
            y: { value: 50, duration: 500, ease: 'Bounce.easeOut', delay: 150 },
            onComplete:() =>  this.checkScore()
          });
          this.tweens.add({
            targets: backCard,
            x: { value: nextCard.x, duration: 1500, ease: 'Power2' },
            y: { value: nextCard.y, duration: 500, ease: 'Bounce.easeOut', delay: 150 }
          });
        } else {
          this.checkScore()
        }
      }
    });
    this.tweens.add({
      targets: backCard,
      x: { value: currentCard.x, duration: 1500, ease: 'Power2' },
      y: { value: currentCard.y, duration: 500, ease: 'Bounce.easeOut', delay: 150 }
    });
  }

  getNextCardName(deck) {
    return first(deck.filter(card => !includes(this.drawnCards, card)))
  }

  hitMe() {
    this.controls.Deal.disableInteractive()
    this.controls.Stand.disableInteractive()
    const offset = (150 + 50 * (this.playerCards.length - 2))
    this.drawPlayer(offset)
      .then(() => {
        const score = this.checkScore()
        if (score < 0) {
          this.dealerWin()
        } else if (score === 21) {
          this.playerWin()
        } else {
          this.drawDealer(offset)
        }
      })
    // const dealersSum = this.sumCards(this.dealersCards)
    // const canDealerDraw = dealersSum < 17
    // const playerSum = this.sumCards(this.playerCards)
    // console.log(dealersSum, playerSum)
    // this.singleDraw((150 + 50 * (this.playerCards.length - 2)), false, canDealerDraw)
  }

  sumCards(cards) {
    return sumBy(cards, c => this.cardValue(c))
  }

  checkScore() {
    const dealersSum = this.sumCards(this.dealersCards)
    let playerSum = this.sumCards(this.playerCards)
    console.log('checkScore', dealersSum, playerSum)

    if (this.drawnCards.length > 3 && playerSum > 21 && dealersSum <= 21) {
      if (!this.hasAce()) {
        return -1
      }
      playerSum -= 10
    }
    if (this.drawnCards.length > 3 && playerSum === 21) {
      return 21
    }

    this.controls.Deal.setInteractive()
    this.controls.Stand.setInteractive()
    return 0
  }

  checkFor21() {
    const playerSum = this.sumCards(this.playerCards)
    return playerSum === 21
  }

  hasAce() {
    return find(this.playerCards, c => includes(c, 'Ace'))
  }

  cardValue(card) {
    if (includes(card, 'Ace')) return 11
    if (includes(card, 'King') || includes(card, 'Jack') || includes(card, 'Queen')) return 10
    return parseInt(card.replace( /^\D+/g, ''))
  }

  initDeck(): string[] {
    const deck = this.textures.get('cards').getFrameNames();
    return shuffle(filter(deck, c => c !== 'back' && c !== 'joker'))
  }

  shuffleDeck(cards: string[]): string[] {
    return shuffle(cards)
  }

  getCardSprite(name): Phaser.GameObjects.GameObject {
    return find(this.children.list, child => child.name === name)
  }

  setInteractive(gameObjects: Phaser.GameObjects.GameObject[]|Phaser.GameObjects.GameObject) {
    if (!isArray(gameObjects)) {
      gameObjects = [gameObjects]
    }

    gameObjects.forEach(o => o.setInteractive())
  }

  setDraggable(gameObjects: Phaser.GameObjects.GameObject[]|Phaser.GameObjects.GameObject) {
    this.setInteractive(gameObjects)
    if (!isArray(gameObjects)) {
      gameObjects = [gameObjects]
    }

    gameObjects.forEach(o => this.input.setDraggable(o))
  }
}

const config: GameConfig = {
  title: "Blackjack",
  width: WIDTH,
  height: HEIGHT,
  parent: "game",
  backgroundColor: "#18216D",
  scene: [Table]
};

export class StarfallGame extends Phaser.Game {
  constructor(config: GameConfig) {
    super(config);
  }
}

window.onload = () => {
  var game = new StarfallGame(config);
};