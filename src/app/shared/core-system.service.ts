import {Injectable} from '@angular/core';
import {Subject, timer} from "rxjs";
import {userInput, userInputsModel} from "./models/user-inputs.model";

@Injectable({
  providedIn: 'root'
})
export class CoreSystemService {
  clockTick = new Subject<boolean>();
  userInput = new Subject<userInput>();
  clearedLine = new Subject<number>();
  newPiece = new Subject<boolean>();
  releaseAllSubs = new Subject<boolean>();
  private pause = false;
  clicks;
  clock;
  constructor() {
    this.resetClock();
    document.addEventListener('keydown', (data: KeyboardEvent) => {
      if (data.code === 'Space') {
        this.pause = !this.pause;
        if (this.pause) {
          this.clockTick.next(this.pause);
        }
      }
      if (data.code === 'KeyR') {
        this.userInput.next(new userInput(userInputsModel.reset));
      }
      if (this.pause) {
        return;
      }
      if (data.code === 'KeyA') {
        this.userInput.next(new userInput(userInputsModel.left));
      }
      if (data.code === 'KeyW') {
        this.userInput.next(new userInput(userInputsModel.up));
      }
      if (data.code === 'KeyS') {
        this.userInput.next(new userInput(userInputsModel.down));
      }
      if (data.code === 'KeyD') {
        this.userInput.next(new userInput(userInputsModel.right));
      }
      if (data.code === 'KeyM') {
        this.userInput.next(new userInput(userInputsModel.turnR));
      }
      if (data.code === 'KeyN') {
        this.userInput.next(new userInput(userInputsModel.turnL));
      }
      if (data.code === 'KeyC') {
        this.userInput.next(new userInput(userInputsModel.hold));
      }
      });

  }

  resetClock() {
    this.setClock(1);
  }

  multiplyClock(scale) {
    if (scale != 0) {
      this.setClock(this.clicks / scale);
    }
  }

  setClock(tickMs) {
    this.clicks = tickMs;
    if (this.clock) {
      this.clock.unsubscribe();
    }
    this.clock = timer(this.clicks, this.clicks).subscribe(() => {
      this.clockTick.next(this.pause);
    });
  }

  setPause(enable) {
    this.pause = enable
  }

}
