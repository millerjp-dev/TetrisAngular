export const enum userInputsModel {
  up,
  down,
  left,
  right,
  hold,
  turnR,
  turnL,
  reset
}
export class userInput {
  input: userInputsModel;
  constructor(input: userInputsModel) {
    this.input = input;
  }
}
