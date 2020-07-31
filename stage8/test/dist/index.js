import React from '../../src/React.js';
import ReactDOM from '../../src/ReactDom.js';

const ThemeContext = React.createContext('theme1');

class LikeButton extends React.Component {
    constructor(props, context) {
        super(props, context);
        this.state = { liked: 'ssdfdsf' };
    }

    componentDidMount() {
        console.log('LikeButton CDM');
    }

    onLikeButtonClick() {
        // setTimeout(() => {
        //     this.setState({
        //         liked: 'hahahah',
        //     })
        // }, 1000);
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
            ),
            React.createElement(
                ThemeContext.Consumer,
                null,
                theme => React.createElement(
                    'div',
                    null,
                    theme
                )
            )
        );
    }
}
class App extends React.Component {
    constructor(props, context) {
        super(props, context);
        this.state = {
            themeState: 'theme5'
        };
    }

    appClickHandler() {
        this.setState({
            themeState: 'theme6'
        });
    }

    render() {
        return React.createElement(
            ThemeContext.Provider,
            { value: this.state.themeState },
            React.createElement(
                'div',
                { onClick: this.appClickHandler.bind(this) },
                React.createElement(LikeButton, null)
            )
        );
    }
}

let domContainer = document.querySelector('#container');
ReactDOM.concurrentRender(React.createElement(App, null), domContainer);