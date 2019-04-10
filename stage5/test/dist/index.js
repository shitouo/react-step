import React from '../../src/React.js';
import ReactDOM from '../../src/ReactDOM.js';

class LikeButton extends React.Component {
    constructor(props) {
        super(props);
        this.state = { liked: 'ssdfdsf' };
    }

    componentDidMount() {
        console.log(this.state);
    }

    render() {
        const buttonStyle = {
            fontSize: '30px'
        };
        return React.createElement(
            'div',
            { style: buttonStyle, className: 'red', onClick: () => console.log('buttopn'), hehe: '1' },
            React.createElement(
                'span',
                null,
                this.state.liked + '1111'
            ),
            React.createElement(
                'div',
                null,
                React.createElement(
                    'span',
                    null,
                    'not like 1'
                ),
                React.createElement(
                    'span',
                    null,
                    'not like 2'
                ),
                React.createElement(
                    'p',
                    null,
                    'not like 3'
                )
            )
        );
    }
}

let domContainer = document.querySelector('#container');
ReactDOM.render(React.createElement(LikeButton, null), domContainer);