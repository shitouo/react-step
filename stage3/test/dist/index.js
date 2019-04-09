import React from '../../src/React.js';
import ReactDOM from '../../src/ReactDOM.js';

class LikeButton extends React.Component {
    constructor(props) {
        super(props);
        this.state = { liked: 'ssdfdsf' };
    }

    render() {
        const buttonStyle = {
            fontSize: '30px'
        };
        return React.createElement(
            'button',
            { style: buttonStyle, className: 'red', onClick: () => console.log('buttopn'), hehe: '1' },
            React.createElement(
                'span',
                null,
                this.state.liked + '1111'
            ),
            React.createElement(
                'div',
                null,
                ' not Like'
            )
        );
    }
}

let domContainer = document.querySelector('#container');
ReactDOM.render(React.createElement(LikeButton, null), domContainer);