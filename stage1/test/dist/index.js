import React from '../../src/React.js';
import ReactDOM from '../../src/ReactDOM.js';

let domContainer = document.querySelector('#container');
ReactDOM.render(React.createElement(
  'h1',
  null,
  'this is title!'
), domContainer);