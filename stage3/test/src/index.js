import React from '../../src/React.js';
import ReactDOM from '../../src/ReactDOM.js';

class LikeButton extends React.Component {
    constructor(props) {
        super(props);
        this.state = { liked: false };
    }

    render() {
        const buttonStyle = {
            fontSize: '30px'
        }
        return (
            <button style={ buttonStyle } className="red" onClick={() => console.log('buttopn') } hehe="1">
                <span>Like</span>
            </button>
        );
    }
}

let domContainer = document.querySelector('#container');
ReactDOM.render(<LikeButton />, domContainer);