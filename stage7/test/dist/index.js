import React from '../../src/React.js';
import ReactDOM from '../../src/ReactDom.js';

class LikeButton extends React.Component {
    constructor(props) {
        super(props);
        this.state = { liked: 'ssdfdsf' };
    }

    componentDidMount() {
        console.log('LikeButton CDM');
    }

    onLikeButtonClick() {
        setTimeout(() => {
            this.setState({
                liked: 'hahahah'
            });
        }, 1000);
    }

    render() {
        const buttonStyle = {
            fontSize: '30px'
        };
        return React.createElement(
            'div',
            { style: buttonStyle, className: 'red', onClick: this.onLikeButtonClick.bind(this), hehe: '1' },
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
ReactDOM.concurrentRender(React.createElement(LikeButton, null), domContainer);