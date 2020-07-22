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
                liked: 'hahahah',
            })
        }, 1000);
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
            </div>
        );
    }
}

let domContainer = document.querySelector('#container');
ReactDOM.concurrentRender(<LikeButton />, domContainer);