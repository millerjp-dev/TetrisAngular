import {AfterViewInit, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {CoreSystemService} from "../shared/core-system.service";
import {userDirection} from "../shared/models/direction.model";
import {userInputsModel} from "../shared/models/user-inputs.model";
import {GarbageBlocks} from "../objects/garbageBlocks.object";
import {Tetrimino} from "../objects/tetriminos.object";

@Component({
  selector: 'app-play-window',
  templateUrl: './play-window.component.html',
  styleUrls: ['./play-window.component.css']
})
export class PlayWindowComponent implements OnInit, AfterViewInit {
  @ViewChild('play', { static: true }) canvas: ElementRef<HTMLCanvasElement>;
  @ViewChild('held', { static: true }) holdArea: ElementRef<HTMLCanvasElement>;
  @ViewChild('next', { static: true }) nextArea: ElementRef<HTMLCanvasElement>;
  context: CanvasRenderingContext2D;
  contextHeld: CanvasRenderingContext2D;
  contextNext: CanvasRenderingContext2D;
  width;
  height;
  flicker = true;
  garbageBlocks = new GarbageBlocks(this.core);
  activePiece: Tetrimino;
  heldPiece: Tetrimino;
  nextPiece: Tetrimino;
  heldSpawnX = 40;
  heldSpawnY = 40;
  playSpawnX = 80;
  playSpawnY = 0;
  nextSpawnX = 40;
  nextSpawnY = 40;
  clearedLines = 0;
  availablePieces = ['IBlock', 'TBlock', 'ZBlock', 'OBlock', 'JBlock', 'LBlock', 'SBlock'];
  pieceBag = [];
  heldThisPiece = false;
  paused = false;
  clicks = 0;
  clickRate = 100;
  level = 1;
  gameClock;
  constructor(private core: CoreSystemService) {
    this.core.clearedLine.subscribe( num => {
      this.clearedLines += num;
      if (this.clearedLines % 3 === 0) {
        this.level++;
        this.clickRate = this.level < 100 ? 100 - (this.level) : 1;
      }
    });
    this.core.newPiece.subscribe( async () => {
      this.activePiece = null;
      await new Promise(resolve =>
        setTimeout(resolve, 500)
      );
      this.newActivePiece();

    });
  }

  ngOnInit() {

  }

  ngAfterViewInit() {
    this.context = this.canvas.nativeElement.getContext('2d');
    this.contextHeld = this.holdArea.nativeElement.getContext('2d');
    this.contextNext = this.nextArea.nativeElement.getContext('2d');
    this.core.newPiece.next(true);
    this.setupGameClock();
    this.core.userInput.subscribe( input => {
      switch(input.input)
      {
        case(userInputsModel.left): this.movePiece(userDirection.Left); break;
        case(userInputsModel.right): this.movePiece(userDirection.Right); break;
        case(userInputsModel.down): this.movePiece(userDirection.Down); break;
        case(userInputsModel.up): this.activePiece ? this.activePiece.hardDrop(): ''; break;
        case(userInputsModel.turnR): this.activePiece ? this.activePiece.turnRight() : ''; break;
        case(userInputsModel.turnL): this.activePiece ? this.activePiece.turnLeft(): ''; break;
        case(userInputsModel.hold): this.holdPiece(); break;
        case(userInputsModel.reset): this.reset();
      }
    });

  }

  setupGameClock() {
    this.clicks = 0;
    this.clickRate = this.level < 100 ? 100 - this.level : 1;
    if (this.gameClock) {
      this.gameClock.unsubscribe()
    }
    this.gameClock = this.core.clockTick.subscribe(paused => {
      this.paused = paused;
      if (!paused) {
        if (++this.clicks % this.clickRate === 0 ) {
          this.clicks = 0;
          this.movePiece(userDirection.Down);
        }
      }
    });
  }

  newActivePiece() {
    if (!this.nextPiece) {
      this.activePiece = Tetrimino.createPiece(this.getRandomPiece(), this.playSpawnX, this.playSpawnY, this.canvas, this.garbageBlocks, this.core);
    } else {
      this.activePiece = Tetrimino.createPiece(this.nextPiece.blockType, this.playSpawnX, this.playSpawnY, this.canvas, this.garbageBlocks, this.core);
    }
    this.nextPiece = Tetrimino.createPiece(this.getRandomPiece(), this.nextSpawnX, this.nextSpawnY, this.nextArea, this.garbageBlocks, this.core);
    this.context.clearRect(0,0,this.canvas.nativeElement.width, this.canvas.nativeElement.height);
    this.contextNext.clearRect(0,0,this.nextArea.nativeElement.width, this.nextArea.nativeElement.height);
    if (!this.activePiece.checkSpawn()) {
      this.reset();
    } else {
    this.heldThisPiece = false;
    this.activePiece.draw();
    this.nextPiece.draw();
    this.garbageBlocks.draw();
    }

  }

  holdPiece() {
    if (this.activePiece && !this.heldThisPiece) {

      this.heldThisPiece = true;
      if (!this.heldPiece) {
        this.contextHeld.clearRect(0,0,this.holdArea.nativeElement.width, this.holdArea.nativeElement.height);
        this.heldPiece = Tetrimino.createPiece(this.activePiece.blockType, this.heldSpawnX, this.heldSpawnY, this.holdArea, this.garbageBlocks, this.core);
        this.heldPiece.draw();
        this.core.newPiece.next(true);
      } else {
        const heldType = this.activePiece.blockType;
        this.activePiece = Tetrimino.createPiece(this.heldPiece.blockType, this.playSpawnX, this.playSpawnY, this.canvas, this.garbageBlocks, this.core);
        this.heldPiece = Tetrimino.createPiece(heldType, this.heldSpawnX, this.heldSpawnY, this.holdArea, this.garbageBlocks, this.core);
        this.context.clearRect(0,0,this.canvas.nativeElement.width, this.canvas.nativeElement.height);
        this.contextHeld.clearRect(0,0,this.canvas.nativeElement.width, this.canvas.nativeElement.height);
        this.heldPiece.draw();
        this.activePiece.draw();
        this.garbageBlocks.draw();
      }
    }
  }

  getRandomPiece() {
    if (this.pieceBag.length < 1) {
      this.refillBag();
    }
    let piece = this.pieceBag[0];
    this.pieceBag = this.pieceBag.slice(1,this.pieceBag.length);
    return piece;
  }

  refillBag() {
    this.pieceBag = this.shuffle(this.availablePieces.slice(0,this.availablePieces.length));
  }

  shuffle(array) {
    let currentIndex = array.length, temporaryValue, randomIndex;
    while (0 !== currentIndex) {
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }

    return array;
  }

  movePiece(dir: userDirection ) {
    this.activePiece != null ? this.activePiece.move(dir) : null;
  }


  reset() {
    this.clearedLines = 0;
    this.level = 1;
    this.core.resetClock();
    this.setupGameClock();
    this.context.clearRect(0,0,this.canvas.nativeElement.width, this.canvas.nativeElement.height);
    this.contextHeld.clearRect(0,0,this.canvas.nativeElement.width, this.canvas.nativeElement.height);
    this.contextNext.clearRect(0,0,this.nextArea.nativeElement.width, this.nextArea.nativeElement.height);
    this.garbageBlocks = new GarbageBlocks(this.core);
    this.nextPiece = null;
    this.activePiece = null;
    this.heldPiece = null;
    this.pieceBag = [];
    this.core.newPiece.next(true);
    this.core.setPause(false);
  }
}


