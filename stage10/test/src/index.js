import React from '../../src/React.js';
import ReactDOM from '../../src/ReactDom.js';
import { createStore } from '../../src/Redux.js';

const ThemeContext = React.createContext('theme1');
const Reducer = function(state = 0, action) {
    switch(action.type) {
        case 'INCREMENT':
            return state + 1;
        case 'DECREMENT':
            return state - 1;
        default: 
            return state;        
    }
}
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
                count: count,
            })
        })
    }

    onLikeButtonClick() {
        store.dispatch({
            type: 'INCREMENT',
        })
    }

    render() {
        const buttonStyle = {
            fontSize: '30px'
        };
        return (
            <div style={ buttonStyle } className="red" onClick = {this.onLikeButtonClick.bind(this)} hehe="1">
                <span>{'this count is ' + this.state.count}</span>
                <div>
                    <span>not like 1</span>
                    <span>not like 2</span>
                    <p>not like 3</p>
                </div>
                <ThemeContext.Consumer>
                    {
                        theme => (
                            <div>{theme}</div>
                        )
                    }
                </ThemeContext.Consumer>
            </div>
        );
    }
}
class App extends React.Component{
    constructor(props, context) {
        super(props, context);
        this.state = {
            themeState: 'theme5'
        }
    }

    // appClickHandler() {
    //     this.setState({
    //         themeState: 'theme6'
    //     })
    // }

    render() {
        return (
            <ThemeContext.Provider value={this.state.themeState}>
                <div>
                    <LikeButton />
                </div>
            </ThemeContext.Provider>
        )
    }
}

let domContainer = document.querySelector('#container');
ReactDOM.concurrentRender(<App />, domContainer);