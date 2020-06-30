import FiberNode from './FiberNode.js';
import { FIBERTAGS } from './Constant.js';

class ReactRoot {
    constructor(container) {
        this.current = new FiberNode(FIBERTAGS.HostRoot, null, null, null);
        this.current.stateNode = container;
        this.current.root = this;
    }
}

export default ReactRoot;