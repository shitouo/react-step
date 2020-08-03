import React from '../../src/React.js';
import ReactDOM from '../../src/ReactDom.js';
import { createStore } from '../../src/Redux.js';

const ThemeContext = React.createContext('theme1');
const Reducer = function (state = 0, action) {
    switch (action.type) {
        case 'INCREMENT':
            return state + 1;
        case 'DECREMENT':
            return state - 1;
        default:
            return state;
    }
};
const store = createStore(Reducer);

class LikeButton extends React.Component {
    constructor(props, context) {
        super(props, context);
        this.state = { count: 0 };
    }

    componentDidMount() {
        console.log('LikeButton CDM');
        store.subscribe(() => {
            const count = store.getState();
            this.setState({
                count: count
            });
        });
    }

    onLikeButtonClick() {
        store.dispatch({
            type: 'INCREMENT'
        });
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
                'this count is ' + this.state.count
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

    // appClickHandler() {
    //     this.setState({
    //         themeState: 'theme6'
    //     })
    // }

    render() {
        return React.createElement(
            ThemeContext.Provider,
            { value: this.state.themeState },
            React.createElement(
                'div',
                null,
                React.createElement(LikeButton, null)
            )
        );
    }
}

let domContainer = document.querySelector('#container');
ReactDOM.concurrentRender(React.createElement(App, null), domContainer);