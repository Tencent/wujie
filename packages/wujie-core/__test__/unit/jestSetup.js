global.fetch = jest.fn();

global.Response = class Response {
  constructor(data) {
    this.status = 200; 
    this.data = data
  }
  text(){
    return this.data
  }
}