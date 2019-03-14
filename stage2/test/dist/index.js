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

        return React.createElement(
            'button',
            { onClick: () => this.setState({ liked: true }), hehe: '1' },
            'Like'
        );
    }
}

let domContainer = document.querySelector('#container');
ReactDOM.render(React.createElement(
    'h1',
    null,
    'this is title!'
), domContainer);