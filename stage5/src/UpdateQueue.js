class UpdateQueue{
    constructor() {
        this.data = [];
    }
    addUpdate(update) {
        this.data.push(update);
    }
    popUpdate() {
        return this.data.pop();
    }
    // 遍历队列
    // 仅支持同步的操作
    traverse(handler) {
        this.data.forEach((item) => {
            handler(item);
        })
    }
}

export default UpdateQueue;