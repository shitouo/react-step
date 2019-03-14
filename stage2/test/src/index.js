import React from '../../src/React.js';
import ReactDOM from '../../src/ReactDOM.js';

class LikeButton extends React.Component {
    constructor(props) {
        super(props);
        this.state = { liked: false };
    }

    render() {
        if (this.state.liked) {
            return 'You liked this.';
        }

        return (
            <button onClick={() => this.setState({ liked: true }) } hehe="1">
              Like
            </button>
        );
    }
}

let domContainer = document.querySelector('#container');
ReactDOM.render(<h1>this is title!</h1>, domContainer);