interface Call {
    position: number;
    offset: number;
}

export class Runtime {

    public running = false;

    public akku = 0;
    public position = 0;
    protected offset = 0;  // how much should be added onto relative positions to get absolute position in stack
    private stack: number[] = [];
    private callStack: Call[] = [];

    /**
     * If stack and other variables should be logged.
     */
    public showDebugLog = false;

    public init(entryFunctionPosition: number, args: number[]) {
        this.debug(`init at position ${entryFunctionPosition}`);

        // place placeholder for return value onto stack
        this.load(0);
        this.push();

        // place arguments onto stack
        for (const arg of args) {
            this.load(arg);
            this.push();
        }

        this.running = true;
        this.jumpFunction(entryFunctionPosition);
    }

    public load(value: number) {
        this.debug(`load ${value}`);

        this.akku = value;

        this.position++;
    }

    public push() {
        this.debug(`push`);

        this.stack.push(this.akku);

        this.position++;
    }

    public pop() {
        this.debug(`pop`);

        this.akku = this.stack.pop()!;

        this.position++;
    }

    public write(relativePosition: number) {
        this.debug(`write ${relativePosition} == ${this.offset + relativePosition}`);

        this.stack[this.offset + relativePosition] = this.akku;

        this.position++;
    }

    public read(relativePosition: number) {
        this.debug(`read ${relativePosition} == ${this.offset + relativePosition}`);

        this.akku = this.stack[this.offset + relativePosition];

        this.position++;
    }

    public jumpFunction(newPos: number) {
        const call = {
            position: this.position,//todo this was newPos?
            offset: this.offset,
        };

        this.debug(`jump ${newPos} // push: pos = ${call.position}, offset = ${call.offset}`);

        this.callStack.push(call);
        this.position = newPos - 1;  // will add 1 later
        this.offset = this.stack.length - 1;

        this.position++;
    }

    public jump(newPos: number) {
        this.debug(`jump ${newPos}`);
        this.position = newPos - 1;  // will add 1 later
        this.position++;
    }

    public return() {
        const call = this.callStack.pop();

        this.debug(`return // pop: pos = ${call!.position} offset = ${call!.offset}`);

        this.position = call!.position;
        this.offset = call!.offset;

        this.running = this.callStack.length > 0.

        this.position++;
    }

    public jumpIfNot(newPos: number) {

        this.debug(`jumpIfNot ${newPos} // ${this.akku === 0 ? "false -> jump" : "true -> don't jump"}`);

        if (this.akku === 0) this.position = newPos - 1;  // will add 1 later

        this.position++;
    }

    public native(functionName: string) {
        this.debug(`native ${functionName}`);
        switch (functionName) {
            case "add":
                this.nativeAdd();
                break;
            case "sub":
                this.nativeSub();
                break;
            case "mul":
                this.nativeMul();
                break;
            case "div":
                this.nativeDiv();
                break;
            case "pot":
                this.nativePot();
                break;
            case "equal":
                this.nativeEqual();
                break;
            case "notequal":
                this.nativeNotEqual();
                break;
            case "less":
                this.nativeLess();
                break;
            case "less_equal":
                this.nativeLessEqual();
                break;
            case "greater":
                this.nativeGreater();
                break;
            case "greater_equal":
                this.nativeGreaterEqual();
                break;
            case "not":
                this.nativeNot();
                break;
            case "and":
                this.nativeAnd();
                break;
            case "or":
                this.nativeOr();
                break;
            case "print":
                this.nativePrint();
                break;
            default:
                throw this.error(`unknown native function: "${functionName}"`);
        }
        this.position++;
    }

    protected nativeAdd() {
        const arg2 = this.stack.pop()!;
        const arg1 = this.stack.pop()!;
        this.akku = arg1 + arg2;
    }

    protected nativeSub() {
        const arg2 = this.stack.pop()!;
        const arg1 = this.stack.pop()!;
        this.akku = arg1 - arg2;
    }

    protected nativeMul() {
        const arg2 = this.stack.pop()!;
        const arg1 = this.stack.pop()!;
        this.akku = arg1 * arg2;
    }

    protected nativeDiv() {
        const arg2 = this.stack.pop()!;
        const arg1 = this.stack.pop()!;
        if (arg2 === 0) throw this.error("division by zero");
        this.akku = arg1 / arg2;
    }

    protected nativePot() {
        const arg2 = this.stack.pop()!;
        const arg1 = this.stack.pop()!;

        // not allowed:
        //     - non-integer exponent if base is negative
        //     - negative exponent if base is zero
        if (arg1 < 0 && !Number.isInteger(arg2)) throw this.error("exponent must be integer if base is negative");
        if (arg1 === 0 && arg2 < 0) throw this.error("exponent must be non-negative if base is zero");
        this.akku = arg1 ** arg2;
    }

    protected nativeEqual() {
        const arg2 = this.stack.pop()!;
        const arg1 = this.stack.pop()!;
        this.akku = arg1 === arg2 ? 1 : 0;
    }

    protected nativeNotEqual() {
        const arg2 = this.stack.pop()!;
        const arg1 = this.stack.pop()!;
        this.akku = arg1 !== arg2 ? 1 : 0;
    }

    protected nativeLess() {
        const arg2 = this.stack.pop()!;
        const arg1 = this.stack.pop()!;
        this.akku = arg1 < arg2 ? 1 : 0;
    }

    protected nativeLessEqual() {
        const arg2 = this.stack.pop()!;
        const arg1 = this.stack.pop()!;
        this.akku = arg1 <= arg2 ? 1 : 0;
    }

    protected nativeGreater() {
        const arg2 = this.stack.pop()!;
        const arg1 = this.stack.pop()!;
        this.akku = arg1 > arg2 ? 1 : 0;
    }

    protected nativeGreaterEqual() {
        const arg2 = this.stack.pop()!;
        const arg1 = this.stack.pop()!;
        this.akku = arg1 >= arg2 ? 1 : 0;
    }

    protected nativeNot() {
        const arg1 = this.stack.pop()!;
        this.akku = arg1 === 0 ? 1 : 0;
    }

    protected nativeAnd() {
        const arg2 = this.stack.pop()!;
        const arg1 = this.stack.pop()!;
        this.akku = arg1 >= 1 && arg2 >= 1 ? 1 : 0;
    }

    protected nativeOr() {
        const arg2 = this.stack.pop()!;
        const arg1 = this.stack.pop()!;
        this.akku = arg1 >= 1 || arg2 >= 1 ? 1 : 0;
    }

    protected nativePrint() {
        const arg1 = this.stack.pop()!;
        console.log(arg1);
        this.akku = arg1;
    }

    private debug(text: string) {
        if (this.showDebugLog) console.debug(`${this.getState()} ${text}`);
    }

    protected error(msg: string) {
        return new Error(`${this.getState()} ${msg}`);
    }

    private getState(): string {
        return `[${this.position}] [off = ${this.offset}] [Akku = ${this.akku}] [Stack = ${this.stack}]`;
    }
}

