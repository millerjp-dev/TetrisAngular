import {Injectable} from '@angular/core';
import {Subject, timer} from "rxjs";
import {userInput, userInputsModel} from "./models/user-inputs.model";

@Injectable({
  providedIn: 'root'
})
export class CoreSystemService {
  clock = new Subject<boolean>();
  userInput = new Subject<userInput>();
  clearedLine = new Subject<number>();
  newPiece = new Subject<boolean>();
  pause = false;
  constructor() {
    document.addEventListener('keydown', (data: KeyboardEvent) => {
      if (data.code === 'Space') {
        this.pause = !this.pause;
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
      if (data.code === 'KeyR') {
        this.userInput.next(new userInput(userInputsModel.reset));
      }
      });
    timer(20, 1000).subscribe(() => {
      this.clock.next(this.pause);
    });
  }

}
