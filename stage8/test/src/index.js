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
        return (
            <div style={ buttonStyle } className="red" onClick = {this.onLikeButtonClick.bind(this)} hehe="1">
                <span>{this.state.liked + '1111'}</span>
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

    appClickHandler() {
        this.setState({
            themeState: 'theme6'
        })
    }

    render() {
        return (
            <ThemeContext.Provider value={this.state.themeState}>
                <div onClick={this.appClickHandler.bind(this)}>
                    <LikeButton />
                </div>
            </ThemeContext.Provider>
        )
    }
}

let domContainer = document.querySelector('#container');
ReactDOM.concurrentRender(<App />, domContainer);