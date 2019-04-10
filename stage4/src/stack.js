/**
 * 栈数据结构
 */
class Stack {
    data = [];

    pop() {
        return this.data.pop();
    }

    push(item) {
        this.data.push(item);
    }

    // 返回栈长度
    getLength() {
        return this.data.length;
    }
}

export default Stack;